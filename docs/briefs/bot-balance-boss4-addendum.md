# Boss4 addendum — decisions, and five corrections from existing evidence

Date: 2026-09-19. Companion to [`bot-balance-boss4-report.md`](bot-balance-boss4-report.md),
which is **not rewritten**: its tables, counts and artifacts stand. This file records the
decisions taken on that screen and corrects five prose claims in it, using only evidence that
already exists.

**No fight was re-run to produce this. No artifact was altered. This is not a logger project.**

---

## 1. Decisions

| Boss | Treatment | Result | Decision |
|---|---|---|---|
| Mire-Gorged Behemoth | Venom `damagePerStack` 9 → 6 | 2/6 → 4/6, no previously-won root lost | **ADOPTED into source.** The Swamp scalar/substitution sequence STOPS. |
| Chitinous Dreadbore | Attack 139 → 104 | 0/6 → 1/6, every remaining loss longer and deeper | **Retained as the supported fallback, NOT adopted.** Cave pressure stays open; one further coarse comparison is authorized. |

**Swamp.** Squire and Apprentice become victories; Slinger and Spirit keep identical clear times
and gain margin (`minHpFraction` 0.0146 → 0.2938 and 0.1042 → 0.5111). Striker still dies after
removing 62.76%, Conduit after 68.74%. This supports **prepared clears with a status-removal
adaptation** — not universal safety, and not proof of first-entry acquisition. No further Swamp
fight matrix is requested.

**Cave.** Squire wins at 69.6 s. Slinger and Spirit die with 253 and 157 HP remaining. The
numerical effect is substantial and uniform in direction, but its adequacy for the initial boss
baseline is **unsettled**. None of these losses is a timeout or proof of an unwinnable build.

The two bosses are **not pooled** into a combined T2 win rate, and Conduit is **not excluded**
because its damage is delivered through summons.

---

## 2. Five corrections to the report's prose

### C1 — §12 contradicts its own §2 table on the Cave Apprentice

§12 states that "Apprentice and conduit still never cross 50% in either arm." The §2 table
records `crossedHalfAtMs: 26,500` for `apprentice / reduced-attack`. **The table is right and is
preserved.** The corrected statement:

> Under the Cave candidate, `crossedHalfAtMs` becomes non-null for striker (73,400 ms), squire
> (36,100 ms) **and apprentice (26,500 ms)**. **Conduit is the only Cave root that never crosses
> 50% in either arm.**

### C2 — the Eruption-multiplier inference is WITHDRAWN

§10 argues that because no event shows a `mitigation.grossDamage` of ~222 (control) or ~166
(candidate), the `dreadbore-emergence` 1.6 multiplier did not land on a player.

**That inference does not follow from that field.** `grossDamage` records the body's **base
attack** on both the ordinary and the pattern path; it does not scale with the pattern
multiplier. The frozen `server/test/boss4Pressure.test.ts` asserts exactly this — it requires
`gross === the body's attack` for multiplier 1 **and** multiplier 1.6, while asserting that the
two paths' *landed* damage differs. A 1.6x hit that landed would still have read 139 or 104.

So a `grossDamage` of 139/104 is **consistent with either path** and says nothing about which
fired. Actual pattern-hit attribution needs the cast/impact event and the damage context
together.

**Consequences, all of them restrictive:** do not change the multiplier on this basis; do not
classify the mechanic as unexercised; and this is **not** a new prerequisite for roster breadth.
(Boss5 pins the property directly, in `boss5Pressure.test.ts`, so the inference cannot recur.)

### C3 — plating shred is not the sole explanation for `hpDamage` variance

§10 attributes the spread in `hpDamage` across otherwise-identical `grossDamage` hits (squire
control: 8 hits at gross 139, `hpDamage` 0–110.75) to accumulating plating-shred stacks alone.
**Barrier and active defenses sit in the same path and are also relevant**, and a `hpDamage` of 0
is far more readily explained by absorption than by shred. A guard *activation count* is not an
independent audit of every protected hit. The variance is **multi-causal and is not attributed
here**.

### C4 — the Cave observation total is 24, not 18

§5 states "Boss3+Boss4 combined on this boss remain 1/18 total observations." Boss3 ran **12**
Cave observations (two arms of six) and Boss4 ran **12**. The combined raw total is **24**.

The count is corrected; the refusal to pool stands and is strengthened. Those 24 span three
different boss-side/player-side treatments, so **no efficacy rate may be computed over them**.

### C5 — the Conduit HP-accounting gap stays UNKNOWN, and its recurrence is not replication

§11 reports `hpLost` exceeding `damageFromBoss` on Conduit/Dreadbore (+84.70 control, +170.82
candidate) and offers its third recurrence as "additional evidence it is a structural property
… rather than run-to-run noise."

**Deterministic recurrence is not independent replication.** The Boss4 Cave control arm is a
byte-exact replay of Boss3's `portable-reference` arm on the same seed against an unchanged
simulation — §4 of the report demonstrates precisely that. A replay reproducing a figure is what
a replay does; it adds no independent sample. The gap is **preserved as unknown**: not filled by
subtracting incompatible counters, not attributed to boss output, not resolved by excluding the
summoner, and not made a logger-migration prerequisite.

---

## 3. What is NOT corrected

The §2 and §3 tables, the 24/24 verification, the exact-match reproduction in §4, the treatment
records in §6, the per-10s-alive guard normalisation in §8, and the retain/adjust judgements all
stand as written. The first-Cleanse timing divergence (striker/squire at 1,300–1,500 ms against
6,200–6,900 ms for the other four) remains a **recorded observation with no isolated cause**, as
Boss3 instructed.

---

## 4. Integration status, per package

| Package | Status | Where |
|---|---|---|
| Behemoth venom `damagePerStack: 6` | **IMPLEMENTED in source** | `shared/src/data/monsters/bossesT2.ts` |
| — its regression | **ADDED** | `server/test/behemothVenom.test.ts` |
| — its installer | **RETIRED** | `boss4Spec.ts` `adopted` marker; the seam now refuses both arms |
| Dreadbore attack `104` | **NOT integrated.** Working fallback only | recorded here and in the Boss5 packet |

The venom change is absolute and authored (`damagePerStack: 6`), with **every other field
unchanged** — cap 4, cadence 1000 ms, duration 8000 ms, ordinary attack 38, the Corrosive Pool
and the 50% phase are all pinned by the new regression.

**It cannot be applied twice.** `boss4Spec.ts` marks the `swamp-pressure` block `adopted`;
`installBoss4Treatment` refuses that block on **both** arms (a "control" arm is not harmless —
it would assert against a `before` that no longer exists); `assertBoss4Definitions` now pins the
**adopted** value as the live one, making the spec a standing regression; and
`scripts/boss4-arms.mjs` refuses to start a Boss4 run at all. `boss4Matrix` and `boss4Pressure`
assert the refusal rather than describing it.

**An independent confirmation, not planned for:** the base definitions hash of the adopted source
is `cd8077b49ce658c2467ba20e692c01c354003b1782ff2f0a8027876895a32f9a` — byte-identical to the
`live` hash every one of Boss4's six swamp **candidate** receipts recorded (report §6). The
adopted source hashes to exactly the treated state the screen measured.

Historical frozen studies and raw artifacts are preserved: the Boss4 packet, report and its
`boss4` output root are untouched, and the retired block keeps its cells and its full
held-fixed list.
