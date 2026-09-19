# Boss2 review — corrections, and the Swamp/Cave evidence read

Dated 2026-09-19. Prepared against the handoff
`boss2-review-and-boss3-preparation-2026-09-19.md`. No fight was re-run, no balance value
was changed, and the original raw evidence is untouched.

Companion: [`bot-balance-boss3-operator-packet.md`](bot-balance-boss3-operator-packet.md).

---

## 1. What was checked, and how

The Boss2 execution revision **resolved locally**: `HEAD` is
`96cf77d4d24f4c3f0e813ee699c31facdcb2de06`, tree
`2bf3a8c44dee64a0516e4496fa57838e2a476c44`, working tree clean at the start of this review.
The web command center could not resolve it through GitHub and therefore read ability source at
the older `9a83b40f`. **That fallback is no longer load-bearing:** every source fact in §3 below
is re-read at the Boss2 execution tree itself. Boss3's own tree differs (it adds a spec, two
tests and three scripts) but its **definitions hash is unchanged at `17aa46cb…`**, verified after
the change — so the simulation these facts describe is the one Boss3 will run.

Artifacts opened, under `.../AppData/Local/mmo-idle/validation/ttk-survey/`:

| Artifact | Used for |
|---|---|
| `boss2/<block>/index.json` x6, `boss1/timberclaw/index.json` | all 42 outcome/timing counts, recomputed |
| `boss2/<block>/manifest.json`, `verification.json` | identity, seeds, per-block verification |
| `boss2/behemoth/…-{spirit,slinger}-s98011/` | the four named recordings |
| `boss2/dreadbore/…-{spirit,slinger}-s98011/` | ditto — `summary.json`, `events.jsonl`, `ready.json` |
| `boss2/{behemoth,dreadbore}/*/events.jsonl` (all 12) | the damage-channel census in §2 |

Both Boss3 blocks read back the frozen `17aa46cb…` definitions hash and `08bcc556…`
hitbox hash, seed `98011`, cap 300,000 ms, and `verified: true`.

**Confirmed unchanged:** 42 observations, 17 `boss-killed` / 25 `bot-died`, 36 newly
executed and 6 carried forward, 0 capped / reset / vanished / ambiguous / invalid. Root
totals are exactly as the handoff states: Striker 3/7, Squire 3/7, Apprentice 1/7,
Slinger 4/7, Conduit 1/7, Spirit 5/7.

## 2. Corrections to the Boss2 report

The report's own tables are right. These are errors in the prose written over them.

**2.1 — Conduit has ONE victory, not two.** Report §4 claims "two boss-killed results".
Recomputed from the seven Conduit rows: `juggernaut` `boss-killed` at 199,200 ms is the
only one; `razortusk`, `behemoth`, `dreadbore`, `emperor`, `gorger` and the reused
`timberclaw` are all `bot-died`. The main 17/42 total and §8's 1/7 count were already
correct.

**2.2 — The Behemoth attribution claim is withdrawn.** Report §3.3 and §8 state that the
Corrosive Pool "bypasses the `damageTaken` pipeline that `damageFromBoss` reflects" and
that "the boss's own stat line does not fully explain the observed lethality". Measured
across all six Behemoth recordings, that is **wrong in both halves**, and the gap runs the
other way:

| Root | `hpLost` | `damageFromBoss` | direct | DoT | DoT share | absorbed | `largestHit` | elapsed |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | 405.5 | 445.0 | 43.0 | 402 | 90% | 70 | 29.0 | 22,200 ms |
| squire | 432.6 | 465.0 | 46.0 | 419 | 90% | 78 | 29.0 | 23,400 ms |
| apprentice | 325.9 | 344.4 | 37.4 | 307 | 89% | 67 | 24.0 | 25,100 ms |
| slinger | 302.4 | 326.0 | 44.0 | 282 | 87% | 62 | 30.0 | 21,600 ms |
| conduit | 310.6 | 342.0 | 26.0 | 316 | 92% | 63 | 30.0 | 22,400 ms |
| spirit | 295.9 | 317.0 | 36.0 | 281 | 89% | 129 | 30.0 | 23,800 ms |

`damageFromBoss` **fully accounts for** what the player took, and every damage event resolves to
the boss (`damageFromAdds` is empty in all six). `hpLost` is *lower* than it in all six, because
barrier absorption (62-129) and healing sit between them. There is no unattributed channel here.
The lethal channel is the venom DoT (`monster-dot:mire-gorged-venom`), which is in the pipeline
and is attributed to the boss.

All six `playerDeathEvidence` records name `kind: "dot"`, `effectName: "Gorged Venom"`, 4 stacks.
`largestHit` is **24-30** in every Behemoth fight — the venom tick itself. There is no burst in
this encounter at all.

**2.3 — Four of six Dreadbore deaths occurred before 50% HP.** Confirmed:
`crossedHalfAtMs` is null for striker, squire, apprentice and conduit; only slinger
(26,700 ms) and spirit (25,200 ms) crossed. `empower-shred` had therefore not fired in
four of the six, and cannot explain them.

**2.4 — Dreadbore is not attrition; it is burst.** Report §3.4 and §8 read the 20.0-43.4 s
spread as "attritional rather than fast". The recordings do not support that:

| Root | `hpLost` | `damageFromBoss` | direct | DoT | `largestHit` | lethal blow | crossed 50% | elapsed |
|---|---:|---:|---:|---:|---:|---|---|---:|
| striker | 683.4 | 698.0 | 698.0 | **0** | 80.8 | Eruption 80.8 | no | 43,400 ms |
| squire | 587.8 | 656.4 | 656.4 | **0** | 110.8 | Eruption 110.8 | no | 34,400 ms |
| apprentice | 338.9 | 396.9 | 375.9 | **0** | 107.0 | melee 82.8 | no | 20,000 ms |
| slinger | 384.4 | 413.9 | 413.9 | **0** | 143.2 | Eruption 143.3 | 26,700 ms | 34,200 ms |
| conduit | 473.7 | 389.0 | 389.0 | **0** | 100.6 | melee 58.0 | no | 37,900 ms |
| spirit | 303.1 | 346.9 | 346.9 | **0** | 149.6 | melee 92.6 | 25,200 ms | 38,200 ms |

(apprentice also carries 21 points on a `debt` channel — its own archetype, not the boss.)

**Zero DoT in any of the six.** `largestHit` is 81-150 against 231-300 max HP — **35-65% of the
pool in one strike** — and the lethal blow is an Eruption or an ordinary melee hit every time. A
long elapsed time with large, widely spaced hits is *sparse burst*, not attrition, and the
distinction is the whole point: it is the difference between "more mitigation would help" and
"removal would help".

**2.5 — Behemoth's clustering is not attributable to the pools.** The 21.6-25.1 s cluster
is real and is a strong prioritization signal, but §2.2 shows what it is: a fixed venom
ramp reaching 4 stacks at ~30 damage/tick against 231-300 HP pools, arriving at the same
time in six separate fights because it is nearly deterministic. The pools contributed no
separately measurable player-damage channel in any of the six.

**2.6 — `hpLost` is not a damage counter, and the relationship is not one-directional.**
Found while checking §2.2 and worth carrying into Boss3 rather than buried. In **11 of the 12**
recordings `hpLost` sits *below* `damageFromBoss`, which is expected: barrier absorption
(62-432) and healing (heal events totalling up to ~285) sit between the two. The **one
exception** is Conduit on Dreadbore, where `hpLost` is **473.7 against a `damageFromBoss` of
389.0** — an excess of ~85 HP with **no corresponding damage event at all**. Every damage event
in that recording resolves to the boss (389.0, `damageFromAdds` empty), so the extra decrease is
not unattributed boss output.

**Preserved as unknown.** It is a per-tick HP decrease with no damage event behind it; Conduit is
the archetype with zero owner `attackBeats` and 41 minion beats, which makes a summoner-side HP
cost the obvious hypothesis — and a hypothesis is all it is. It is **not** investigated here and
**not** subtracted from anything. The operative rule for the Boss3 report: a per-tick HP decrease
is not exhaustive gross damage, it can run either side of the attributed total, and the gap must
never be closed by subtracting incompatible counters.

**2.7 — Positional counterplay DID act, on both bosses.** Recorded per fight:
`telegraph-dodge` 12 (Behemoth) and 20 (Dreadbore); `hazard-escape` 4 on Behemoth. Step
Back and `avoid-hazards` were exercised. Neither all-loss outcome is explained by the
references standing still.

**2.8 — Retained as stated.** `CannotAttack` explains Conduit's zero owner attack beats and
nothing else. Min HP is a 1000 ms sampled minimum, not a continuous one. Low add-to-owner
damage does not establish low total add influence. The concealment test classifies
temporary disappearance and proves nothing about defensive movement or damage balance; no
generic concealment investigation is opened.

## 3. The four named recordings, and the Cleanse facts

Read at the Boss2 execution tree. **Every one of these is re-asserted mechanically at run
time** by `assertBoss3Definitions()` and `boss3Cleanse.test.ts`, so a later edit fails
qualification instead of silently invalidating the packet.

**3.1 — The references genuinely lack Cleanse.** All twelve Boss3-relevant `ready.json`
receipts declare and apply `guards: ['second-wind','brace']`, `sources.abilities:
"explicit"`. No arm of Boss2 carried a status-removal tool. (Note: `resolveSurveyPackage`'s
*preparation default* for tier ≥ 2 is `['second-wind','cleanse']` — the reference cells
override it explicitly. The substitution arm therefore restores what the default would
have been, which is a point in its favour as an *ordinary, legal* build, not a contrivance.)

**3.2 — Costs.** Cleanse 3 RP, Brace 5 RP. Computed per root with
`runicPointLoadoutCost`: Striker/Squire 26 → 24, the other four 28 → 26, against a budget
of 30. **Exactly 2 RP freed on every root**, left unspent.

**3.3 — Cleanse at player tier 2.** `abilityRankIndex = playerTier − homeTier`; Cleanse's
home tier is 1, so tier 2 resolves **rank II**: `{ stacks: 2, debuffs: 1 }`, cooldown
10,000 ms, trigger `has-debuff`. It removes up to **2 stacks from ONE** effect per use. It
does not clear every affliction, grant immunity, remove a pool from the floor, or replace
positional counterplay. Brace at tier 2 is `drPct 0.40 / 3000 ms / knockbackResist 0.55`,
cooldown 10,000 ms, trigger `hp-below 0.5`.

**3.4 — Eligibility, per block.** `statusPolicyFor` defaults an unlisted, non-ambient
effect to `cleanse: 'full'`. Both bosses' riders are unlisted:

| Block | Effects actually present | Policy | Cleanse's target |
|---|---|---|---|
| Swamp | `monster-dot:mire-gorged-venom` (9/stack, max 4, 8 s, refreshed on hit) | harmful, full | the venom — **the lethal channel** |
| Cave | `plating-shred` (2/stack, max 6, no expiry) and `slow` (0.5x, 2000 ms, 1 stack) | both harmful, both full | `plating-shred` |

The Corrosive Pool's own slow and its 1500 ms `damageTakenPct 0.12` vulnerability are
hazard-local and appeared as no standing player status in any of the six Behemoth
recordings, so they are **not** declared as Cleanse targets. Cleanse does not touch
Eruption's direct damage and does not remove a pool from the floor.

**3.5 — Selection, verified by fixture not by reading.** `applyCleanse` orders candidates
by **deepest stack first, ties broken by ascending id**, then takes `debuffs` of them.
On Cave two effects are live, so this is load-bearing: `plating-shred` wins the ramped case
and *also* wins the 1-vs-1 tie (`'p' < 's'`). Both are asserted in
`server/test/boss3Cleanse.test.ts`, and the test **fails** when the sort is inverted
(mutation-checked). Had the tiebreak gone the other way, the treatment would have spent a
10 s cooldown on a rider that expires by itself — a no-op dressed as a substitution.

**3.6 — Where the deaths sit relative to a payoff.** Behemoth: Second Wind fires at
14.6-17.8 s and Brace at 16.6-18.8 s, both *after* venom reaches 3-4 stacks and both
expiring 2-5 s before the death at 21.6-23.8 s. Dreadbore: shred reaches 5 stacks by
34.1 s (10 plating stripped off a base 18), and Brace fires two or three times. In both
arms the guards act; the Behemoth pattern is that mitigation and a heal arrive while a DoT
that neither answers keeps ticking.

**3.7 — A known limit, recorded not repaired.** `hasHarmfulDebuff` (the `has-debuff`
trigger) reads harmfulness, **not** cleanseability, so Cleanse can legally fire against an
immune effect and remove nothing. No immune effect is present on either Boss3 boss, so it
is inert here. It means **an activation with an empty `removedEffects` is a legal outcome**,
and the Boss3 verifier must not treat one as a defect. Asserted as a negative control in
the fixture.

**3.8 — No functional defect found.** Nothing in these four recordings is a reproducible
bug. Both all-loss outcomes are the encounter working as authored against a package with no
answer to it. Accordingly no stat compensation is proposed, and no infrastructure work is
opened.

## 4. Prediction, recorded before the run

Stated so the screen can be wrong rather than merely interpreted afterwards. The authored
default trigger is used and **not** tuned, so these inefficiencies are part of what is
being measured:

- **Swamp is the plausible block.** Cleanse's only eligible target is the channel doing
  87-92% of the damage. But `has-debuff` fires at the *first* stack (~6.6-6.8 s), when only
  1 stack exists, so the first use strips 1 and burns the 10 s cooldown; the second lands
  at ~16.6-16.8 s against 3-4 stacks. Expect roughly 2 activations before a death at
  ~22-25 s, and a partial, not total, reduction in DoT throughput.
- **Cave is the block that may get worse.** `plating-shred` is a mitigation lever, and
  giving up a 40% DR window against 92-149 point hits may cost more than restoring 4
  plating returns. On this block the first Cleanse (~6.3 s) fires when only the `slow` is
  live — corrosion arrives at ~7.1 s — so it is spent on the 2 s rider regardless of the
  tiebreak.

A failed substitution on either block does **not** show that no other build could work, and
does not justify an ability buff.

## 5. Campaign status after this review

- T2 boss **coverage** is complete (7 bosses x 6 roots = 42). It is coverage, not T2
  balance completion, and says nothing about T1/T3/T4 boss readiness or guardian access.
- The Swamp/Cave response test is next, as **one** paired screen: Boss3, 24 fights.
- Retained limitations: Timberclaw and Razortusk remain difficult portable matchups;
  Apprentice and Conduit remain reference-fit questions (Conduit's has a stated design
  explanation, Apprentice's does not). **No global class verdict** follows from either.
- Guardian/access remains unmeasured (`not-measured-guard-stripped`) and must never be
  pooled into a boss figure.
- Boss1's Sovereign block keeps its **separate retrospective-verification** status. Boss2's
  passing tests do not retroactively certify it.
- Unchanged and not reopened: the durability campaign, Jungle navigation, the
  historical-versus-legacy reference comparison, global player/build selection, the T3
  Jungle pressure exception, earlier Mountain limitations, and ECON-1.
