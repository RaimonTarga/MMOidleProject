# Balance Iteration Handoff — for the iterating agent

**Written 2026-08-23** at the end of the instrument-repair session. Audience: the model
that will run the balance tools and apply numeric changes. Read this before touching
anything.

**Read `CLAUDE.md` first** — it is the repo contract and overrides anything here that
contradicts it.

Deeper context, only if you need it:
- `docs/briefs/BALANCE_TOOL_AUDIT_HANDOFF_2026-08-23.md` — what each instrument measures and what it does not
- `docs/tier-balance-current-state.md` — the authored ladder
- `docs/briefs/balance-instrument-inventory-2026-08-23.md` — the tool catalogue

---

## 0. State of play

All reports in `reports/` are **current as of 2026-08-23 22:34** and committed. Every one
is newer than the tool that produced it. You do not need to regenerate before you start
reading — only after you change a number.

The instruments were repaired this session (§4). `pnpm typecheck` is clean and the test
suite is 94/94.

---

## 1. Your job, and what is not your job

**Your job**
- Run the report tools, read them, and report what they say.
- Apply numeric changes the designer specifies.
- Smooth the monster ladder within a tier, once you have a target (§2).
- After every change: regenerate the affected report, run the relevant tests, and say
  plainly what moved.

**Not your job — escalate instead**
- **Item and class numbers.** The analytical reports model only 4 of 9 player power
  sources (§5). Tuning armour or class output against them bakes in that gap.
- **Anything inside `tools/`.** There is no typecheck covering that directory (§6). A
  broken instrument fails silently and poisons everything downstream.
- **Deciding whether an outlier is intentional.** That is a designer call.
- **The boss problem.** T1 boss exam reads 0/150. Do not try to fix it by tuning; it needs
  a design decision first.
- **Structural change of any kind.** This phase is numerical only. No new systems, no
  economy/reward/crafting changes, no mechanic redesigns.

---

## 2. You need a target before you tune

There is currently **no authored answer** to "what is correctly pitched". Two decisions
gate all tuning work, and the designer is settling them separately:

- **D1 — absolute difficulty anchor.** Which encounter is correctly pitched? Expected form:
  *"a tier-appropriate player in tier-native +3 gear should clear [named boss] with N% HP
  remaining in M seconds."*
- **D2 — healthy durations.** Boss fight length, and target trash time-to-kill.

**Do not invent these.** If you tune without them you will optimise toward a target you
made up, and it will look confident and be wrong. If you have not been given D1 and D2,
your job is limited to *reporting what the tools say*, not changing numbers.

The other open decisions (D3 gear budget, D4 report loadout, D5 acceptable spread, D6
stance budget, D7 modifier curve, D8 Conduit's role) are in §9 of the audit handoff. You
do not need them for monster-ladder work.

---

## 3. Commands

```bash
# The monster ladder — your main lane
pnpm mob:llm                  # -> reports/mob-llm-packet-t{1..4}.md   START HERE
pnpm mob:report               # -> reports/mob-report.html
pnpm tier:table --tier 1      # -> reports/tier-1-table.md   (player-free, within-tier only)
pnpm monster:ref --biome=cave --tier=1   # raw authored stats, no analysis

# Context, do not tune against these without escalating
pnpm dps:llm                  # class x weapon offence
pnpm ehp:llm                  # class x armour x charm survivability

# Runtime truth
pnpm boss:exam -- --tier 1
pnpm bench:balance -- --mode farm --tier 1 --hours 1

# Always before reporting done
pnpm typecheck
pnpm test                     # ~5 min; full gate
```

Per repo convention, run only the tests your change touches while iterating; full
`pnpm test` is the pre-commit gate.

---

## 4. What was repaired this session

Read this so you know why old conclusions do not apply.

| | Fix | Consequence |
|---|---|---|
| 1 | **Spike ordering.** Runtime mitigates first, then multiplies the charged/empowered hit. Both reports were doing `mitigate(A x M)` instead of `mitigate(A) x M`. | Every old spike column was inflated by a plating-dependent factor. |
| 2 | **`mob-report` learned `chargedAttack` and `consecutiveHits`** (plus volleys and finishers). 47 of 134 monsters carry a charged attack. | A third of the roster previously read as having no offensive mechanic. Spikes above 100% of player HP became visible for the first time. |
| 3 | **`ehp-report` DR ramps.** It *claimed* to approximate hardening / stationary / sustained-fight DR and referenced none of them. Now all four ramps (plus reactive plating) are duty-cycle averages. | Four of seven T3/T4 armour lineages had been scored at zero credit for their signature mechanic. |
| 4 | **Loadout banner** on every report and the Balance Lab (§5). | The gap is now stated, not silent. |
| 5 | **`monster:ref` script repaired.** It had never run; its output had never existed. | `reports/monster-ref.md` is new. |
| 6 | **Parity fixtures** (`server/test/instrumentParity.test.ts`, 7 cases) pinning the shared damage kernel to the runtime. | Formula drift now fails a test instead of silently corrupting reports. |
| 7 | **`pnpm boss:exam`** added. | The only instrument that fights a real boss now has a script. |
| 8 | **`mob-report` restructured around the progression walk** (§7). | The biggest change. See below. |

**Every historical `mob-report` and `ehp-report` conclusion is void.** The T1 biome threat
order changed (Mountain and Swamp swapped), and Mountain's worst-spike monster changed
identity from Cliff Hopper to Ridge Ambusher.

---

## 5. The one gap you must keep in mind

The analytical reports (`mob`, `dps`, `ehp`, and the Balance Lab) build a player carrying
**weapon, armour, charm and mobility only**, plus skill nodes, item upgrades and class
affinities. They equip **no core, relic, rune, rite, stance or ability**. The bench bots
carry all six.

This is stated at the top of every report. It means:
- Numbers are comparable **to each other** (the omission is uniform across rows).
- Numbers are **not** comparable to bench output in absolute terms.
- In the walk table (§7), the **step** column largely survives this gap because the same
  omission applies to every rung. The **absolute cost/kill** column does not.

When an analytical report and the bench disagree, **the bench wins**. That rule already
paid off once this session: `dps-report` calls Conduit the top T1 class, while the boss
exam ranks it last of six. The bench was right.

---

## 6. Traps

1. **`bench:balance --mode boss` has never fought a boss.** It measures dungeon guards —
   the boss spawns from an altar the bot never touches. Use `pnpm boss:exam`.
2. **Bench time-scale ceiling is 2.** Above that, throughput is understated by 5–30%.
3. **`damageTaken` under-reports.** Monster DoT, AoE and node damage bypass the combat
   pipeline. If you write a new measurement, sum per-tick HP decreases instead.
4. **`tools/` is typechecked by nothing.** `tsconfig.bench.json` covers only `src` and
   `bench`. A syntax error there passes `pnpm typecheck` and only fails at run time.
5. **`tier:table` eHP is comparable within a tier, never across tiers** — the probes differ
   per tier. For cross-tier scale, read raw HP.
6. **Threat indices are discovery signals, not gates.** Deliberate outliers are the point
   of authored content.
7. **Two assumed duty cycles** live at the top of `tools/ehp-report.ts`
   (`STATIONARY_FRACTION = 0.5`, `HARDENING_SPIKE_INTERVAL_SEC = 12`). They materially
   affect Tundra and Volcanic armour rankings. They are assumptions, not measurements —
   do not treat those two lineages' numbers as settled.
8. **Plains T1 is `locked: true`** in `shared/src/data/balanceProgression.ts`. An automated
   proposal must not modify its monsters, pool weights, density, bosses or rewards.

---

## 7. How to read the mob report

It now leads with **The Walk** — the only section that measures each biome against the
player who actually arrives there.

Arrival gear is **derived, not assumed**: Global Mastery accrues as you master each biome
and is the only gate on upgrade level, so every tier walks +0 → +4 across its ladder.

Current T1:

| # | Biome | Arrive with | Mob TTK | Your TTL | Worst hit %HP | Cost/kill | Step | |
|---|---|---|---|---|---|---|---|---|
| 1 | Plains | T1 +0 | 1.90s | 44.2s | 6.3% (Boar) | 4.29% | — | baseline |
| 2 | Forest | T1 +1 | 3.52s | 19.0s | 7.4% (Wolf) | 18.5% | **4.31x** | **WALL** |
| 3 | Swamp | T1 +2 | 3.12s | 9.43s | 2.4% (Mud Toad) | 33.1% | 1.79x | ok |
| 4 | Mountain | T1 +3 | 4.62s | 8.31s | 57.2% (Ridge Ambusher) | 55.6% | 1.68x | ok |
| 5 | Caverns | T1 +4 | 5.62s | 7.11s | 87.0% (Cave Brute) | 79.0% | 1.42x | ok |

- **Cost/kill** = share of your health pool one average kill spends (incoming DPS x TTK).
  It folds offence and defence into one number. **No player recovery is modelled** — that
  lives in the eHP packet — so this overstates real attrition.
- **Step** = this rung's cost / the previous rung's. Difficulty *after* the player's own
  growth. This is the load-bearing column.
- **WALL / EASIER labels** use thresholds of 1.8x and 0.95x. Those are **discovery labels
  I chose, not authored targets.** Replace them once D2 lands.

Then **Walls & Stalls** lists only the rungs that break the pattern. Everything under
**Detail** holds the player fixed at one power level — a different, still-valid question,
but do not read it as the climb.

**What T1 currently says:** the wall is Plains → Forest (4.31x), not the late biomes.
Plains costs 4.3% of your pool per kill, which is close to free. After Forest the climb is
smooth and decelerating (1.79 → 1.68 → 1.42), which is a healthy shape.

Other tiers, unreviewed: T2 and T4 both have a **WALL on the final rung** (Desert 3.33x,
Trench 3.42x) with an EASIER rung immediately before, so their last two biomes are
inverted relative to intent. T3's Tundra reads cost/kill 254% with a 3.22s TTL.

---

## 8. Where numbers live

- Monsters: `shared/src/data/monsters/*.monsters.ts`, bosses in `bossesT{1..4}.ts`
- Items/recipes: `shared/src/data/recipes/*.recipes.ts`
- Node modifiers: `shared/src/world/nodeModifiers.ts` (magnitudes marked PLACEHOLDER)
- Stances: `shared/src/stances.ts` (numbers are explicitly seeds)
- Progression policy: `shared/src/data/balanceProgression.ts` (T1 only; note `locked`)

`shared/src/*.ts` root files are legacy shims — never author new data there.

---

## 9. Working rules

- A precise answer from a stale model is worse than a rough answer from a trustworthy one.
- Analytical outliers are investigation signals, not automatic failures.
- Do not flatten intentional specialization.
- Equal tooltip DPS does not mean equal weapon value. Fast and slow weapons interact
  differently with flat plating and may need different raw output.
- Flat plating makes incoming hit size decisive.
- Conditional defences must never be valued as permanently active.
- Simulation outranks reconstructed analytical formulas when they disagree.
- Change one thing at a time, regenerate, and report what moved. Batching numeric changes
  makes the cause of a movement unrecoverable.
- If you are unsure whether something is a bug or a design choice, stop and ask.
