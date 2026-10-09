# Ability pass — evidence

Raw evidence for the ability pass run (`docs/briefs/ability-pass-run-2026-10-02.md`).
Wave 0 (W0) took the references every later wave is judged against, on branch
`feat/ability-pass-baseline` off `feat/ability-pass` at **`e56d530e`** (= develop).

All commands run from `server/` (`tsx` resolves there, not at the repo root). The lab
**appends** to `--out`, so every shard writes a fresh file; delete old shard files before
a rerun. Rows carry `wallMs` (wall-clock time); identity comparisons drop it.

## 1. The T1 baseline (the hard constraint)

| file | what | rows | wall |
|---|---|---:|---:|
| `plan-baseline.json` | `_t1BossPlan.ts --matrix=tutorial-pair --seeds=30` at `e56d530e`: six classes × five T1 bosses × 30 seeds, the guide's kit (`tut-<lean lane>×<verb lane>`: Effect lean at `leanRank` 3 + the weapon's own verb, on the tutorial boss kit from `shared/src/tutorial/scripts/plans.ts`) and a no-card control (`tut-control`) | 1,800 | 2 s |
| `baseline.jsonl` / `baseline.md` | the lab on that plan — **the parity reference** | 1,800 | 162 s, 5 shards |
| `plan-d593ceea.json` | the same command at `d593ceea` (byte-identical to `plan-baseline.json`) | 1,800 | 2 s |
| `repro-d593ceea.jsonl` | the lab at `d593ceea` (run in `../mmo-lin-w2a`, detached) | 1,800 | 165 s, 5 shards |
| `effect-parity-d593ceea-vs-tip.md` | the parity script, `repro-d593ceea.jsonl` vs `baseline.jsonl` | | |

0 error rows anywhere. Seeds are `_t1BossPlan.ts`'s `SEEDS` (the first 30: 173, 947, 2027, …,
32323); the plan carries `jitter: true` (seeded approach geometry) and `compact: true`
(so the rows have no `dps8`).

**Reproduction (the gate before wave 1): holds.** `repro-d593ceea.jsonl` equals
`reports/legibility/final-tutorial-pair.jsonl` row for row (1,800/1,800, `wallMs`
dropped, sorted). `d593ceea`'s server/shared/client code is byte-identical to
`b6d3b130`, where that file was measured.

**`d593ceea` → `e56d530e` moves exactly the rows it should.** The control rows (900) and
the Slinger's Dagger kit rows (150) are identical; all 750 rows of the five Axe-kit
classes (`tut-tempo×tempo`: Striker, Squire, Spirit, Apprentice, Conduit) moved, from
`6ea13a91` (`LEAN_RANK_ONE_PAYLOAD_SCALE` 0.10 → 0.50; the Axe kit wears Effect III, so its
Chopping Rhythm echo goes from ×1.20 to ×2.0). `9ff1b9eb` (the Hammer's Easy Prey seeds its
own slow) touches no kit: no tutorial class fights with the Hammer. No other row moved.

The Effect-parity re-measure (design §26.5's "the next run's baseline re-measures it"),
kit cells, mean dps and wins, `d593ceea` → tip:

| class | Razorback | Greatbear | Toadeater | Behemoth | Broodmother |
|---|---|---|---|---|---|
| striker | 40.8 → 43.9 (+7.7%), 29/30 → 29/30 | 53.4 → 55.6 (+4.2%), 30/30 | 35.2 → 37.7 (+7.2%), 30/30 | 33.9 → 37.7 (+11.3%), 30/30 | 34.0 → 35.6 (+4.9%), 30/30 |
| squire | 35.3 → 37.9 (+7.5%), 30/30 | 43.9 → 46.0 (+4.9%), 30/30 | 31.7 → 34.3 (+8.0%), 30/30 | 29.8 → 31.3 (+5.2%), 30/30 | 30.4 → 32.7 (+7.8%), 30/30 |
| slinger (Dagger) | 53.8 (0.0%), 30/30 | 76.1 (0.0%), 30/30 | 79.3 (0.0%), 30/30 | 72.1 (0.0%), 30/30 | 68.1 (0.0%), 30/30 |
| spirit | 39.1 → 43.0 (+9.9%), 30/30 | 51.9 → 55.3 (+6.6%), 30/30 | 49.6 → 51.0 (+2.9%), 30/30 | 42.3 → 45.9 (+8.7%), 30/30 | 41.3 → 43.7 (+5.8%), 30/30 |
| apprentice | 39.7 → 41.3 (+3.9%), 30/30 | 47.9 → 49.0 (+2.2%), 30/30 | 45.2 → 47.1 (+4.1%), 30/30 | 44.2 → 45.7 (+3.6%), 30/30 | 41.1 → 42.4 (+3.2%), 30/30 |
| conduit | 36.6 → 40.8 (+11.4%), 30/30 | 53.1 → 58.7 (+10.5%), 30/30 | 55.1 → 59.7 (+8.3%), 30/30 | 34.7 → 38.8 (+11.7%), 30/30 | 36.5 → 40.4 (+10.8%), 30/30 |

Win rates do not move (the kit already won ≥97% everywhere); mean dps rises +2.2% to
+11.7%. The full table with the controls is `effect-parity-d593ceea-vs-tip.md`.

## 2. The parity script

`server/scripts/_abilityPassParity.ts` (underscore: outside the suite). Groups per
(candidate label, class, boss) — the label is the row id's first `|` field, so the kit
(`tut-tempo×tempo`, `tut-affliction×affliction`) and the control (`tut-control`) are
separate cells — and prints, per file, n, mean dps, mean dps8 (`-` on compact rows), win
rate, the % delta of mean dps and the win-rate delta in points.

```
node --conditions=development --import tsx scripts/_abilityPassParity.ts \
  <baseline.jsonl> <candidate.jsonl> [--tol=5] [--min=10] [--md=<out.md>] [--control=a,b]
node --conditions=development --import tsx scripts/_abilityPassParity.ts <a.jsonl> <b.jsonl> --identity
```

- Gate: every KIT cell has n ≥ 10 in both files and |Δ mean dps| ≤ 5%. Control cells
  (labels `control` or `*-control`, or `--control=`) print under their own heading, ungated.
- Exit: 0 inside; 1 a kit cell outside, under the minimum, missing from one file, or a lab
  `error` row; 2 a read/format error.
- `--md=<file>` writes both tables as markdown, for pasting into a report.
- `--identity`: are the two files the same fights row for row (`wallMs` dropped)? Prints
  same/differ/one-sided counts per label; exit 0 identical, 1 not.

Self-check: `baseline.jsonl` against itself → 30/30 kit cells inside, every Δ 0.0, exit 0.
`repro-d593ceea.jsonl` vs `baseline.jsonl` → exit 1 (16 Axe cells outside, as expected:
that is the Effect-parity move above, not a regression).

## 3. Every later wave: the parity check

On the branch under test (W1-A changes the kit's Technique column in `plans.ts`, so the
plan is **regenerated on the branch under test**, never copied):

```bash
cd server
T=<task>   # e.g. w1a, w1-merge, w2-merge, final
node --conditions=development --import tsx scripts/_t1BossPlan.ts \
  --out=../reports/ability-pass/plan-$T.json --matrix=tutorial-pair --seeds=30
rm -f ../reports/ability-pass/$T.shard*.jsonl
for i in 0 1 2 3 4; do
  node --conditions=development --import tsx scripts/_t1BossLab.ts \
    --plan=../reports/ability-pass/plan-$T.json --out=../reports/ability-pass/$T.shard$i.jsonl \
    --hitboxes=../reports/progression-phase0/hitboxes.json --shard=$i --shards=5 &
done; wait
cat ../reports/ability-pass/$T.shard?.jsonl > ../reports/ability-pass/$T.jsonl
rm ../reports/ability-pass/$T.shard?.jsonl
node --conditions=development --import tsx scripts/_abilityPassParity.ts \
  ../reports/ability-pass/baseline.jsonl ../reports/ability-pass/$T.jsonl \
  --md=../reports/ability-pass/$T-parity.md
node --conditions=development --import tsx scripts/_t1BossMatrix.ts ../reports/ability-pass/$T.jsonl --md \
  > ../reports/ability-pass/$T.md
```

~165 s at 5 shards on this machine. A W1-A Slam candidate is the same plan with the lab's
`ap` override on every row, e.g.
`{"ap": {"slam": {"field": "damageMult", "values": [<rank I>, <rank II>, …]}}}` (a
single value applies to every rank; list the authored later ranks after the candidate).

## 4. Wave 3: the no-card identity check

The legibility run's no-band plan against its final file: a character with no cards and
no changed ability must fight exactly as on develop. Use the **frozen** plan file —
`reports/t1-boss-pass/plan-base.json` is committed and byte-identical to
`_t1BossPlan.ts --cand=base --seeds=30` at `e56d530e` (checked in W0) — because
regenerating it after W1-A would pick up the new kit:

```bash
cd server
T=final
rm -f ../reports/ability-pass/$T-base.shard*.jsonl
for i in 0 1 2 3 4; do
  node --conditions=development --import tsx scripts/_t1BossLab.ts \
    --plan=../reports/t1-boss-pass/plan-base.json --out=../reports/ability-pass/$T-base.shard$i.jsonl \
    --hitboxes=../reports/progression-phase0/hitboxes.json --shard=$i --shards=5 &
done; wait
cat ../reports/ability-pass/$T-base.shard?.jsonl > ../reports/ability-pass/$T-base.jsonl
rm ../reports/ability-pass/$T-base.shard?.jsonl
node --conditions=development --import tsx scripts/_abilityPassParity.ts \
  ../reports/legibility/final-base.jsonl ../reports/ability-pass/$T-base.jsonl --identity
```

The frozen plan's rows name the old kit's abilities: `sweep` + `second-wind` on the
Razorback, `expose-weakness` + `cleanse` on the Toadeater, `expose-weakness` +
`second-wind` on the other three bosses (every class). After W1-A cuts Expose Weakness, 24
of its 30 cells name a cut ability; "no changed ability" then covers only the rows whose
abilities survive unchanged, and the identity is read on those (a row that names a cut id
errors or runs migrated; either way it is not a defect of this check).

**Verified in W0 at `e56d530e`:** the frozen plan's 900 rows equal `final-base.jsonl`
900/900 (`--identity`, exit 0; 55 s at 6 shards; the run itself is not kept).

## 5. The T3/T4 stacking before/after (`stacking.md`)

The legibility run's `poison-stack` / standalone `hemorrhage` change, measured on
`7360e3b0` (before, `../mmo-lin-w1d2` detached), `d593ceea` (mid, `../mmo-lin-w2a`
detached) and `e56d530e` (after). The plans regenerate byte-identical on all three. The
table, its attribution and the readings are in `stacking.md`.

| file | instrument | rows | wall |
|---|---|---:|---:|
| `stacking-t2lab-{before,d593ceea,after}.jsonl`, `stacking-t2lab-cells.md` | (a) the T2 boss lab, Rapier and Dagger | 6,000 each | ~1,500 s each, 4 shards, the three concurrently |
| `plan-boss5-t34.json`, `stacking-boss5-{before,d593ceea,after}.jsonl`, `stacking-boss5-cells.md` | (b) boss5Spec's tier-3/4 reference rows, through the lab | 78 each | ~225 s each, 3 shards |
| — | (c) ability-node Affliction rows: no bench exposes them; not measured | | |

(a), from `server/` (the plan is 4.5 MB and regenerates in 3 s, so it is not committed;
sha256 `2387e3dd696ff554…` on all three commits):

```bash
node --conditions=development --import tsx scripts/_t1BossPlan.ts \
  --out=<plan-t2.json> --matrix=composition --tier=2 --seeds=10 --weapons=rapier,dagger
# lab sharded as in §3 (4 shards) -> <t2.jsonl>
```

(b): `pnpm bench:balance` does not read `boss5Spec.ts`, and the spec's own runner
(`scripts/bossScreen.ts --trial=boss5`) refuses to start on every commit here (its frozen
definitions check counts five rules; the resolved package has seven). The rows go through
the lab instead, verbatim (see `stacking.md` and the header of
`server/scripts/_abilityPassStacking.ts`):

```bash
node --conditions=development --import tsx scripts/_abilityPassStacking.ts \
  --boss5-plan=../reports/ability-pass/plan-boss5-<T>.json          # reads boss5Spec on the branch under test
# lab sharded as in §3 (3 shards) -> ../reports/ability-pass/<T>-boss5.jsonl
node --conditions=development --import tsx scripts/_abilityPassStacking.ts \
  --before=../reports/ability-pass/stacking-boss5-after.jsonl \
  --after=../reports/ability-pass/<T>-boss5.jsonl \
  --title="boss5 T3/T4: W0 vs <T>" --md=../reports/ability-pass/<T>-boss5.md
```

For W1-A's rerun with Slam: once `boss5Spec.ts`'s tier-3/4 reference names `slam`, the
regenerated plan carries it (diff it against `plan-boss5-t34.json`: only the `techniques`
column should change), and the table above puts it beside W0's `stacking-boss5-after.jsonl`.
`--mid=<file>` adds a three-way split; `--moved-only` lists only the rows that moved;
`--cells-md=<file>` writes every cell to a second file.

## 6. W1-A — the Slam rank I parity number (branch `feat/ability-roster`)

The kit column of the tutorial-pair plan changed (Expose Weakness → Slam on the Greatbear,
Toadeater, Behemoth and Broodmother; Plains keeps Sweep), so the plan was regenerated on
the branch: `plan-w1a.json` differs from `plan-baseline.json` in `techniques` only, on
exactly those 1,440 rows. Candidates ran §3's commands with the `ap` override
`{"slam": {"field": "damageMult", "values": [<rank I>, 1.75, 2.0, 2.25]}}` on every row:

| file | Slam rank I | worst kit cell | kit cells outside ±5% |
|---|---:|---|---:|
| `w1a-slam-1.75.jsonl` | 1.75 | striker Behemoth -13.9% | 14 |
| `w1a-slam-2.15.jsonl` | 2.15 | striker Behemoth -10.1% | 11 |
| `w1a-slam-2.2.jsonl` | **2.2** | conduit Behemoth +8.9% | 12 |
| `w1a-slam-2.25.jsonl` | 2.25 | conduit Behemoth +9.3% | 13 |
| `w1a-slam-2.4.jsonl` | 2.4 | squire Greatbear +12.1% | 10 |

**No single value brings every cell inside ±5%**: the Slinger, Spirit and Striker cells
fall and the Conduit, Apprentice and Squire cells rise together as the multiplier moves
(a ~17 pp spread at every candidate; Slam's value tracks attack cadence, and a Conduit
casts through one summon while the others keep swinging, where Expose Weakness paid every
class the same share). Per the brief, the committed value is the one that minimises the
worst cell: **2.2** (worst +8.9%, the Conduit on the Behemoth; the Striker on the Behemoth
-8.1%). `w1a.jsonl` is the authored run (no override) on the branch's final code and is
IDENTICAL to `w1a-slam-2.2.jsonl` (1,800/1,800, `--identity`), so nothing else in the
branch moved a T1 kit fight; every Razorback cell is ±0.0% at every candidate. Matrix:
`w1a-parity.md` (kit and control cells), `w1a.md`; the per-cell ladder:
`w1a-ladder.md`. The candidate plans are not kept (plan + override).

The boss5 tier-3/4 rerun with Slam in place of Expose Weakness is in `stacking.md`
("Rerun"), `w1a-boss5.md` and `w1a-boss5-cells.md` (plan `plan-boss5-w1a.json`).

## 7. After each wave merge, and wave 3 (the conductor, on `feat/ability-pass`)

| file | what | result |
|---|---|---|
| `plan-wave1.json`, `wave1.jsonl`, `wave1-parity.md`, `wave1.md` | §3 on the wave-1 merge (`5633b3c4`) | plan byte-identical to `plan-w1a.json`; matrix IDENTICAL to `w1a.jsonl` (1,800/1,800): W1-B..F move no T1 cell; parity broken by W1-A's Slam (12/30) |
| `plan-final.json`, `final.jsonl`, `final-parity.md`, `final.md` | §3 on the wave-2 merge (`d6e1d84f`, which is also wave 3's tip: no code commit between) | matrix IDENTICAL to `wave1.jsonl` (1,800/1,800): wave 2 moves no T1 cell; **parity broken, 18/30 kit cells inside, worst +8.9% (Conduit, Behemoth)**; every kit cell still wins ≥97% |
| `final-base.jsonl`, `final-base-identity.md` | §4, the frozen no-band plan | the 180 rows whose abilities survive unchanged (the Razorback's Sweep + Second Wind) IDENTICAL to `reports/legibility/final-base.jsonl`; the 720 rows naming the cut Expose Weakness are refused by the lab (`illegal ability budget`), as §4 predicted |
| `w4d.jsonl` | §3 on W4-D (`feat/ap-boss-gates`: the boss appliers pass the Guard keystone gates, design §22.12) | plan regenerated byte-identical to `plan-final.json` (not kept); matrix IDENTICAL to `final.jsonl` (1,800/1,800, `--identity`, 0 error rows): the gates move no T1 fight |

## 8. W4-A — the Slam rank I two-number solve (branch `feat/ap-slam-parity`, design §22.12)

Design §22.12 solves parity on two numbers: Slam rank I authors its `damageMult` AND its
wind-up, and ranks II–IV become 2.45 / 2.7 / 2.95 on the 1.6 s wind-up (no T1 fight reads
them). The plan was regenerated on the branch: `plan-w4a.json` is byte-identical to
`plan-final.json`. Candidates ran §3's commands with the `ap` override on every row,
`{"slam": {"field": "damageMult", "values": [<m>, 2.45, 2.7, 2.95], "castMs": <c>}}` (the lab
writes `castMs` into every rank; only rank I fights at T1), three candidates at a time at 5
shards each (~255 s per three, 0 error rows). Wind-ups on the 100 ms tick grid, from 1600 down
to Charge's 400.

| file | what |
|---|---|
| `w4a-slam-<m>-<castMs>.jsonl`, `…-parity.md` | the 15 candidates (1.75/1200, 1.55/1000, 1.35, 1.4, 1.45/800, 1.25, 1.28, 1.3, 1.31/700, 1.15, 1.18, 1.2, 1.22/600, 1.6, 2.2/400) |
| `w4a-ladder.md` | every candidate (with W1-A's 1600 ladder) → worst kit cell and cells outside; every cell |
| `w4a.jsonl`, `w4a-parity.md`, `w4a.md` | the authored values, no override, on the branch's final code |

**Result: 1.2 on a 600 ms wind-up passes** — 30/30 kit cells inside ±5%, worst −4.7% (Striker,
Greatbear), no kit win rate moves (the Striker's Behemoth, 97% at W1-A's 2.2, is back to 100%).
`w4a.jsonl` is IDENTICAL to `w4a-slam-1.2-600.jsonl` (1,800/1,800, `--identity`). 600 ms is the
longest wind-up that passes: at 700 ms every rank I hit size measured leaves exactly one cell out
(the Striker's Greatbear below −5% or the Apprentice's Greatbear above +5%, attack 48 on both, so
they move together in whole hit points); at 800 ms and above the spread does not fit. 1.18 and
1.2 pass at 600 ms; 1.2 has the smaller worst cell. The no-card controls (ungated) run −4.3%
(Spirit, Behemoth) to +9.9% (Conduit, Behemoth), down from W1-A's +26.7% there.

The boss5 tier-3/4 rerun with ranks III/IV at 2.7/2.95 is `stacking.md` "Rerun 2",
`w4a-boss5.md` and `w4a-boss5-cells.md` (plan `plan-boss5-w4a.json`, byte-identical to
`plan-boss5-w1a.json`; run `w4a-boss5.jsonl`). Its control, `w4a-boss5-oldranks.jsonl`, is the
same plan on this branch with `{"slam": {"field": "damageMult", "values": [1.2, 1.75, 2.0, 2.25]}}`,
which separates the rank change (T3 +5.6%, T4 +5.1%) from the pass's own T4 path drift since
W1-A's branch (the Reverb Squire and Pyromancer Apprentice rows; T4 Apprentice −40.5%).

## 9. The final gate after wave 4 (the conductor, merged tip `5b7cbc0f`)

| file | what | result |
|---|---|---|
| `plan-final-w4.json`, `final-w4.jsonl`, `final-w4-parity.md`, `final-w4.md` | §3 on the tip with every wave-4 branch merged | plan byte-identical to `plan-final.json`; matrix IDENTICAL to `w4a.jsonl` (1,800/1,800); **PARITY HOLDS, 30/30 kit cells inside ±5%, worst −4.7% (Striker, Greatbear)** |
| `final-w4-base.jsonl`, `final-w4-base-identity.md` | §4, the frozen no-band plan | the 180 rows with unchanged abilities IDENTICAL to `reports/legibility/final-base.jsonl`; the 720 naming the cut Expose Weakness refused, as before |

## 10. Design §22.13's two "measure before deciding" calls (branch `feat/ap-measure`)

Off `feat/ability-pass-calls-2` (`12d2b1f1`). No game code or number changed. Two throwaway
scripts: `server/scripts/_apMeasurePlans.ts`, which rewrites the existing generators' plans
into one candidate label per arm, and `server/scripts/_apMeasureReport.ts`, which builds
the tables. The lab gained one optional row field, `skillPath`, an explicit skill path used
verbatim. Rows without it are derived exactly as before. It is the only way to state a T4
character with no T3 path. All three runs went concurrently on this machine: 12 processes,
6 cores, 0 error rows.

| file | what | rows | wall |
|---|---|---:|---:|
| `plan-measure-slam-t2.json`, `measure-slam-t2.jsonl`, `measure-slam-t2.md`, `measure-slam-t2-cells.md` | (1) Slam's tier-up step at T2: the T2 composition matrix's no-card control rows (5 weapons × 6 classes × 5 T2 bosses × 10 seeds) with the Technique set to Sweep / Slam as authored / `ap` castMs 600 / `ap` 1.2× on castMs 600 | 6,000 | 925 s, 6 shards |
| `plan-measure-pyro.json`, `measure-pyro.jsonl` | (2) the Apprentice's boss5 T3/T4 rows, 10 seeds (99011 + nine), fixed spawn: the Pyromancer, the frame alone, and every other dot T3 path with its frame | 930 | 793 s, 4 shards |
| `plan-measure-pyro-old.json`, `measure-pyro-old.jsonl` | (2d) the balanced-frame arms at `e56d530e` with Slam held at the tip's numbers | 310 | 569 s, 2 shards |
| `measure-pyromancer.md`, `measure-pyro-cells.md` | (2) the tables | | |

From `server/` (`$SP` is any scratch directory; the two input plans regenerate in seconds
and are not kept):

```bash
R=../reports/ability-pass
# (1) Slam at T2
node --conditions=development --import tsx scripts/_t1BossPlan.ts \
  --out=$SP/plan-t2-composition.json --matrix=composition --tier=2 --seeds=10
node --conditions=development --import tsx scripts/_apMeasurePlans.ts \
  --slam-t2-from=$SP/plan-t2-composition.json --out=$R/plan-measure-slam-t2.json
for i in 0 1 2 3 4 5; do
  node --conditions=development --import tsx scripts/_t1BossLab.ts \
    --plan=$R/plan-measure-slam-t2.json --out=$R/measure-slam-t2.shard$i.jsonl \
    --hitboxes=../reports/progression-phase0/hitboxes.json --shard=$i --shards=6 &
done; wait
cat $R/measure-slam-t2.shard?.jsonl > $R/measure-slam-t2.jsonl   # then delete the shard files
node --conditions=development --import tsx scripts/_apMeasureReport.ts \
  --slam=$R/measure-slam-t2.jsonl --md=<tables.md> --cells-md=$R/measure-slam-t2-cells.md

# (2) the Pyromancer
node --conditions=development --import tsx scripts/_abilityPassStacking.ts --boss5-plan=$SP/plan-boss5.json
#   (byte-identical to plan-boss5-w4a.json)
node --conditions=development --import tsx scripts/_apMeasurePlans.ts \
  --pyro-from=$SP/plan-boss5.json --out=$R/plan-measure-pyro.json
node --conditions=development --import tsx scripts/_apMeasurePlans.ts \
  --pyro-from=$SP/plan-boss5.json --out=$R/plan-measure-pyro-old.json --old
# lab as above, 4 shards -> $R/measure-pyro.jsonl
# (2d) on a detached checkout of e56d530e (below), from its server/, with this branch's
#      _t1BossLab.ts copied in (the lab is otherwise identical on both commits):
#      lab on plan-measure-pyro-old.json, 2 shards -> measure-pyro-old.jsonl
node --conditions=development --import tsx scripts/_apMeasureReport.ts \
  --pyro=$R/measure-pyro.jsonl --old=$R/measure-pyro-old.jsonl --w4a=$R/w4a-boss5.jsonl \
  --md=<tables.md> --cells-md=$R/measure-pyro-cells.md
```

The `e56d530e` checkout is `git worktree add --detach
C:/Users/osaif/AppData/Local/mmo-idle/ap-measure-e56d530e e56d530e`. It has no install:
`node_modules/.pnpm` is junctioned to the donor store
(`../mmo-lineages/node_modules/.pnpm`). `server/`, `bot/`, `client/` and `admin/` each get
a `node_modules` of junctions copied from this worktree's, with `@mmo-idle/shared`
repointed at the checkout's own `shared/`. A probe confirmed the checkout reads its own
data (the old Pyromancer's `max-stack-bonus-mult`, the old Slam's three ranks at home tier
2). The checkout is left in place, detached and uncommitted. To remove it, delete its
junctions first (`rmdir` on a junction removes only the link), then the worktree.

Checks: `e56d530e` fights the frame-alone, Firebrand, Cinder Lord and T3 rows identically
to the tip (250/250 rows, `wallMs` dropped); only the Pyromancer rows differ. The tip's
seed-99011 T3 rows equal `w4a-boss5.jsonl`'s. `tsc -p tsconfig.bench.json` (it includes the
lab) is clean.

## Commits

Branch `feat/ability-pass-baseline` off `feat/ability-pass` (`e56d530e`). Nothing was
committed in the measurement checkouts; `../mmo-lin-w2a` is left detached at `d593ceea`
and `../mmo-lin-w1d2` at `7360e3b0`.
