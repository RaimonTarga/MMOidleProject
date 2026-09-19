# Boss5 operator packet — roster breadth, plus one bounded Cave refinement

**Status: FROZEN, NOT LAUNCHED.** This packet authorizes preparation only. Sonnet executes it
once, under this packet. Opus is **not** authorized to launch it.

## 1. The question

Boss1–Boss4 spent 108 observations on T2 and produced a complete T2 coverage map, a defensive
substitution result, and one adopted boss-side value. They produced **no current evidence at T1,
T3 or most of T4**. So Boss5's primary experiment is breadth:

> Against six tier-legal reference packages, what actually happens on every in-scope active solo
> boss that has no usable current evidence?

and, independently of that, one further coarse Cave comparison:

> On the exact Boss4 Brace references, is attack **85** meaningfully better than **104**?

## 2. Scope, and what Boss4 settled

Boss4's Swamp candidate is **adopted into source** (`damagePerStack: 6`) and its block is
retired; see [the Boss4 addendum](bot-balance-boss4-addendum.md). The Swamp scalar/substitution
sequence is **closed** and no Swamp block appears here. Cave's 104 is retained as a **fallback,
not an adoption**, and Block C is the one authorized extension of it.

**This is not** a build search, a win-rate estimate, a scalar grid, a class-parity exercise, or
permission to tune any boss that Block B happens to find difficult. Block B installs **nothing**.
Block C installs one field from a two-value declared list and restores it.

## 3. Frozen identity

| Item | Value |
|---|---|
| Frozen at | the committed tip carrying the venom adoption; resolved **mechanically**, see below |
| **Base definitions hash** | **`cd8077b49ce658c2467ba20e692c01c354003b1782ff2f0a8027876895a32f9a`** |
| **Hitbox hash** | **`08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`** |
| Hitbox artifact | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Trial | `boss5` |
| Blocks | 18 breadth blocks + `cave-refinement` = **19** |
| Seeds | breadth `99011` (fresh, predeclared); Cave `98011` (carried from Boss2) |
| Caps | T1 300,000 ms · T3 600,000 ms · T4 900,000 ms · Cave 300,000 ms |
| Total | **6 × 18 + 12 = 120 fights** |
| Output root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss5` |
| Preflight root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss5-preflight` |

**The base hash MOVED, deliberately, and it is not the Boss1–Boss4 hash.** `17aa46cb…` was the
pre-adoption source. `cd8077b4…` is the adopted source — and it is byte-identical to the `live`
hash every one of Boss4's six swamp **candidate** receipts recorded. The adopted source hashes to
exactly the treated state that screen measured. That is a confirmation of the integration, not a
licence to reuse pre-adoption rows as though nothing changed (see §5).

**THE BASE HASH IS NOT PROOF THAT A FIGHT RAN UNTREATED.** It is computed once when the child
process loads, *before* any install. What proves an observation's treatment state is three
per-cell records, all asserted by the runner and all present in `ready.json`: `damageTreatment`,
the `bossRuntime` readback, and `definitionsIdentity` (`base` vs `live`).

**Block C inverts the usual reading of those records, and this is load-bearing.** Both of its
arms are **treated**. 104 is the Boss4 *candidate*; authored source is still **139**. So there is
no untreated Cave arm, every Cave receipt must carry a change, and a Cave receipt whose runtime
read 139 is **the Boss4 baseline wearing this block's label** — a failure, not a reassurance.

Revision and tree are resolved **mechanically**, never chosen:

```bash
git rev-parse HEAD          # -> pass as --revision
git rev-parse HEAD^{tree}   # -> pass as --tree
```

`scripts/boss5-run.mjs` asserts, before creating any output, that `HEAD` equals `--revision`,
that `git status --porcelain --untracked-files=no` is empty, that the tree hash matches, and that
the hitbox file hashes to the frozen value. **If a hash has changed, the source is not what this
packet froze and the run is refused.** Stop and report.

## 4. The roster — resolved from source, not assumed

`DUNGEON_DEFS` holds **26** active dungeon bosses. Eight are excluded as already covered, each
with named provenance; the remaining **18** are Block B. N is derived, never written down: the
spec computes it, `boss5Matrix.test.ts` re-derives it independently from `DUNGEON_DEFS`, and
`scripts/boss5-arms.mjs` states it a third time as a hand list. **All three must agree or the run
refuses to start.**

**Already covered, and reused with provenance:** `apex-timberclaw` (Boss1, 1/6),
`stoneplate-juggernaut` 5/6, `jungle-dread-gorger` 5/6, `dune-stalker-emperor` 4/6,
`gorging-razortusk` 2/6 (all Boss2), `mire-gorged-behemoth` (Boss4, 4/6 at the now-adopted
value), `chitinous-dreadbore` (Boss4, 1/6 at 104 — Block C continues it), and
`charnel-crown-sovereign` (Boss1, retrospectively reviewed and confirmed).

**The Sovereign keeps its original failed artifact-verification status and is NOT re-run merely
to change that label.**

**Out of scope, structurally:** the Void Overlord is not in `DUNGEON_DEFS` at all, so it falls
out by construction rather than by a filter. The spec asserts it is still absent, so a future
change that made it a dungeon boss would be a visible contradiction rather than a silent
addition.

**Source compatibility of the reused evidence is a claim about the CHANGE, not about the hash.**
The hash moved, so none of it is byte-identical-source evidence. What makes it reusable is
narrower and checked: the only authored field that moved belongs to `mire-gorged-behemoth`, and
the spec asserts no other roster boss carries that venom effect.

## 5. The tier-legal references — and the two departures, both DECLARED

Boss1–Boss4 ran one shape: defensive stance, `expose-weakness`, the ordered Guard pair
`['second-wind','brace']`, five ordered rules, +5 items. **That shape is T2's, and carrying it
unchecked is forbidden.** Two departures were found by measurement during preparation and are
declared here rather than discovered in a report.

### 5.1 T1 cannot field the T2 shape — measured, not assumed

`setAbilityLoadout` **refuses** `second-wind + brace + ANY technique` on all six roots at T1's
22 RP budget. Tier 1 also admits **no stance at all**.

So T1 keeps the ordered Guard pair — the half the Boss1–Boss4 rows are built on — and **drops
the technique**, running an explicit empty technique list (an explicit `[]` is a real statement;
an omission would silently inherit the tier default). 18–20 of 22 RP, with headroom on every
root.

| Tier | Stance | Techniques | Guards | Measured RP |
|---|---|---|---|---|
| T1 | none (tier admits none) | `[]` | `second-wind`, `brace` | 18–20 / 22 |
| T3 | `defensive-stance` | `expose-weakness` | `second-wind`, `brace` | 26–28 / 38 |
| T4 | `defensive-stance` | `expose-weakness` | `second-wind`, `brace` | 26–28 / 47 |

### 5.2 The kit is FIXED within a tier, and it is NOT the Boss1–Boss4 kit

The natural construction — keying gear to each dungeon's own biome, as the mob surveys do —
**silently produces a different player per dungeon**. It was written that way first and the
preflight caught it: T1 Forest resolved to 0.22 dodge / 0.02 DR against T1 Cave's 0 dodge / 0.13
DR. A Forest row and a Cave row would have been two different players, and any cross-boss reading
of them would have been comparing kits.

So the kit is held fixed across every boss at a tier. **Mountain** is the family used, because it
is the only one authored at every tier: `plains-boots` stops at T2 and `cave-vest` stops at T3,
so no analogue of the Boss1 carried kit can even be *spelled* at T4.

- **T1** `mountain-vest-t1`, `mountain-charm-t1`, `mountain-boots-t1`
- **T3** the T3 set, plus `core-tempered`
- **T4** the T4 set, plus `core-tempered` and `relic-colossus-heart`

**This is a DIFFERENT kit from the one Boss1–Boss4 carried.** Block B rows are readable against
one another within and across tiers. **The report must NOT present them as a continuation of the
T2 rows**, and must not claim a portable-kit comparison with them.

Weapons are the root's own, from the survey ladder (T1) and the qualified T4 set. Block C is
untouched by all of this: it carries the Boss4 T2 reference package through the same constructor
Boss1/Boss2/Boss3/Boss4 used, guard list **omitted** so it is `REFERENCE_GUARDS` by construction.

## 6. Seeds — and an honest limitation

One predeclared seed per block. **No second seed is added to manufacture independent coverage.**

**Measured: 0 of the 18 breadth bosses can move with the seed.** Boss1 established the property
and its trap — a boss with no adds, a fixed spawn and deterministic evasion produces
byte-identical outcomes across seeds. The spec resolves each boss's `spawn-adds` species and
`raisesDead` from `bossScript`, and **none of the 18 has either**. `charnel-crown-sovereign` is
the roster's only boss with adds, and it is in the covered set.

So for every Block B observation the declared seed is **inert**, and each row is **one
deterministic case, not a sample**. The report must state this and must not present six roots on
one seed as a win rate.

## 7. The blocks

One block **per boss**, driven in its own child process and verified on its own. **A gameplay
loss — or even a verification failure — on one boss must never consume another boss's
allocation.** The run loop deliberately does not stop on a failed block.

| Block | Tier | Boss | HP | Attack | Cells | Cap | RP |
|---|---|---|---:|---:|---:|---:|---|
| `t1-cave` | T1 | `obsidian-broodmother` | 1750 | 40 | 6 | 300 s | 18-20/22 |
| `t1-forest` | T1 | `gnarled-greatbear` | 1800 | 24 | 6 | 300 s | 18-20/22 |
| `t1-mountain` | T1 | `crag-behemoth` | 2100 | 56 | 6 | 300 s | 18-20/22 |
| `t1-plains` | T1 | `tusked-razorback` | 1700 | 34 | 6 | 300 s | 18-20/22 |
| `t1-swamp` | T1 | `grave-toadeater` | 2100 | 13 | 6 | 300 s | 18-20/22 |
| `t3-cave` | T3 | `deep-core-burrow-gorger` | 12895 | 196 | 6 | 600 s | 26-28/38 |
| `t3-desert` | T3 | `dune-carapace-monarch` | 11940 | 196 | 6 | 600 s | 26-28/38 |
| `t3-jungle` | T3 | `apex-bramble-slasher` | 11701 | 104 | 6 | 600 s | 26-28/38 |
| `t3-mountain` | T3 | `crag-gorged-horn-behemoth` | 12418 | 204 | 6 | 600 s | 26-28/38 |
| `t3-swamp` | T3 | `rot-spore-croc-behemoth` | 11940 | 52 | 6 | 600 s | 26-28/38 |
| `t3-tundra` | T3 | `frost-plated-rime-mammoth` | 12895 | 204 | 6 | 600 s | 26-28/38 |
| `t3-volcanic` | T3 | `cinder-shell-magma-salamander` | 11462 | 179 | 6 | 600 s | 26-28/38 |
| `t4-desert` | T4 | `dune-throne-sovereign` | 17893 | 185 | 6 | 900 s | 26-28/47 |
| `t4-jungle` | T4 | `verdant-crown-predator` | 18352 | 117 | 6 | 900 s | 26-28/47 |
| `t4-mountain` | T4 | `iron-crest-titan` | 19499 | 228 | 6 | 900 s | 26-28/47 |
| `t4-trench` | T4 | `elder-trench-serpent` | 21793 | 143 | 6 | 900 s | 26-28/47 |
| `t4-tundra` | T4 | `glacial-patriarch` | 22940 | 189 | 6 | 900 s | 26-28/47 |
| `t4-volcanic` | T4 | `caldera-sovereign` | 20646 | 130 | 6 | 900 s | 26-28/47 |
| `cave-refinement` | T2 | `chitinous-dreadbore` | 4375 | **104 / 85** | 12 | 300 s | 26-28/30 |

**Caps are derived from each tier's own pools**, following Boss1's reasoning (it resolved 600 s
for a 19,499 HP T4 boss against measured kills of 36–104 s). T4's 900 s is roughly nine times the
slowest T4 clear on record. **A cap is not a time-to-kill**, and death and timeout are preserved
as **distinct** results.

### 7.1 Block C — the one bounded Cave refinement

**104 versus 85**, exact Boss4 Brace references, all six roots, seed `98011`, 300 s cap = **12
fights**. The 104 arm is the supported Boss4 candidate, **not** the old 139 baseline, which is
**not repeated**.

**85 is not a fitted optimum**, a projected win probability, or a guaranteed damage reduction. It
is one deliberate further step of ~18.3% below 104 (~38.8% below 139), chosen before the run and
never re-picked. Rationale: one clear, two near-clears and substantial broad improvement at 104
justify one coarse extension — and Conduit's especially poor result does **not** get to set the
target for every build.

**The authored step is NOT the effect size.** Measured in `boss5Pressure.test.ts`: the 18.3%
authored cut produces a **22.1–23.7%** post-mitigation fall and a **21.7–25.5%** landed fall,
non-uniform across roots, because plating subtracts before the scaling.

Held fixed and pinned: HP, plating, DR, attack cadence, burrow, contact slow, shred, recovery,
pattern multiplier, hitbox and every player field. Both arms install an **absolute** value
through the isolated seam and restore **139**.

## 8. Qualification — actually run during preparation

### 8.1 Typecheck and tests

```bash
pnpm typecheck
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss5Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss5Pressure.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/behemothVenom.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss4Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss4Pressure.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss3Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss3Cleanse.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss2Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss1Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/bossDeclaration.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/bossTerminal.test.ts
```

All executed and clean. `pnpm typecheck` includes `typecheck:bench`, which covers `bench/` and
`scripts/bossScreen.ts` individually.

### 8.2 The functional fixture — `server/test/boss5Pressure.test.ts`

Zero fights. It installs the real arms through the real seam, spawns real bodies through the real
spawn path, fires the real damage entry points, and establishes:

- both Cave arms reach the **spawned body**, the ordinary hit and the 1.6x pattern hit, and
  **neither runs at the authored 139**;
- `grossDamage` reads the body's **base attack on both paths** — pinned explicitly, so the
  withdrawn Boss4 inference (addendum C2) cannot recur;
- the **measured** fall, larger and non-uniform against the authored step;
- all **108** breadth cells install nothing and resolve authored source;
- restoration on the exception path, across a 104 → 85 → 104 sequence, and cross-boss isolation
  against all 18 breadth bosses.

### 8.3 Preflight — 19 blocks, ZERO fights spent

Executed against a fresh root. Every block qualified: the guard strips, **the boss wakes and is
alone at the bell**, the package is its tier's declared reference, the RP cost is inside the
**tier's own** budget, and every receipt's treatment state matches its block kind. Block C's two
arms are byte-identical in the player package on all six roots.

```
t1-cave … t1-swamp        qualify ok — tier-1 reference legal (RP 18-20/22)
t3-cave … t3-volcanic     qualify ok — tier-3 reference legal (RP 26-28/38)
t4-desert … t4-volcanic   qualify ok — tier-4 reference legal (RP 26-28/47)
cave-refinement           qualify ok — 12 cells, attack 104 vs 85 (authored 139, neither arm)
boss5 preflight: ok — 19 blocks, 120 planned observations, ZERO fights spent
```

**No pilot, anywhere.** Eighteen of nineteen blocks are first contact with a boss this harness has
never fought, which is exactly the situation in which an exploratory fight quietly becomes the
result.

## 9. Commands

Check first that no `boss5` study output exists; never overwrite another study. The runner
refuses an existing root.

```bash
node scripts/boss5-preflight.mjs \
  "C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss5-preflight" \
  "C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json"

node scripts/boss5-run.mjs \
  --out="C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss5" \
  --revision="$(git rev-parse HEAD)" \
  --tree="$(git rev-parse HEAD^{tree})" \
  --definitions="cd8077b49ce658c2467ba20e692c01c354003b1782ff2f0a8027876895a32f9a" \
  --hitboxes="C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json" \
  --hitbox-hash="08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83"
```

Per-block watchdogs: 40 min (T1, Cave), 60 min (T3), 90 min (T4).

## 10. What the report must separate

1. **Terminal outcome first** — killed / died / **capped** / encounter-reset /
   `boss-vanished-no-kill` / simultaneous-terminal / invalid — before anything else. **Capped and
   died are distinct**; at T3/T4 pools a cap is a live possibility and must never be folded into
   "died".
2. **Planned / started / terminal / verified counts**, one row per observation. Missing
   observations are **not** passes.
3. **Per boss, per root**: outcome, elapsed, boss HP remaining and the fraction actually removed.
   **No `ttk` is extrapolated** from any non-kill.
4. **Block C paired**, by root, in four categories. Name them for the **arms** (`both-won`,
   `lower-only-won`, `upper-only-won`, `both-lost`) — **neither arm is a control.**
5. **The treatment record**: breadth receipts empty with `live == base`; Cave receipts one
   change each with `live != base`. A Cave receipt reading 139 is a **failure**.
6. **Mechanic exposure**, per boss: casts started/fired and cast labels. **Zero casts is not zero
   mechanics** — report the exposure, do not infer the mechanic was inert.
7. **The seed limitation**, stated plainly: 0 of 18 breadth bosses can move with the seed, so
   each row is one deterministic case, not a sample.
8. **The kit caveat**, stated plainly: Block B's kit is fixed within a tier and is **not** the
   Boss1–Boss4 kit, so these rows are not a continuation of the T2 rows.
9. **Guardian/access is NOT measured** — the guard is stripped by design. Never pooled in.
10. **Reference, never corroboration.** Every Boss5 row is a first observation.
11. **Do not pool** across bosses, tiers, or the two Cave arms into any combined rate.

## 11. Stop rules

- **A gameplay loss is a RESULT, never a stop.** A 0/6 block is data; it does not halt the run or
  license a mid-run substitution.
- **No exploratory or win-seeking pilots. No mid-run package substitution. No second seed. No
  third arm. No additional scalar.**
- A block whose **identity** fails (boss never woke, wrong boss, definitions drift, declared ≠
  applied) is preserved **without retry**, and the remaining blocks continue.
- A **shared** identity or runtime failure — the base hash wrong, the tree dirty, the hitbox hash
  wrong — stops everything before any output is created.
- Boss5 is a **decision checkpoint**, not licence for a follow-on permutation grid on any boss it
  finds difficult.

## 12. After Boss5

Prioritize decisions over a new packet. The next main artifact is the **missing-tier boss
readiness map** — one roster-level retain / change / open table, **at most three gross
interventions recommended at a time** — not another two-boss theorycrafting discussion.

A low result with an evidently unsuitable package is a **reference-fit** question, not
automatically an enemy nerf; and the theoretical existence of some better build is not permission
to defer a broad failure indefinitely. For Cave: prefer **104** if further relief clearly costs
encounter pressure; prefer **85** if it gives credible broader clears with meaningful mechanics.
**Do not demand 6/6** or choose on binary victory counts alone.
