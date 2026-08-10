# Overnight Session Brief — Balance Instruments & Enemy Tables (W5a + W5c)

**Agent:** GPT Sol 5.6 on Codex. **Mode:** unattended, no back-and-forth.
**Branch:** cut from `feat/biome-ecology-pass2`.
**Runs concurrently with** `session-ui-sweep.md` (a different agent working in
`client/`). **Respect the file boundary in §2.**

Read `CLAUDE.md` first — it is the repo's contract and overrides anything here that
contradicts it. Program context: `docs/polish-and-balance-roadmap.md` (this session is
W5a and W5c of Stage 3).

---

## 1. What this project is, in one paragraph

MMO Idle is a server-authoritative idle RPG. Players build a character (class, skills,
gear, cores, relics, stances, rites, runes) and the server decides all combat outcomes
at 10 Hz. The world is a grid of nodes across 11 biomes and 4 tiers. **Every balance
number in the game is currently a placeholder.** The owner is about to do a large
balance pass, and this session builds the instruments that pass depends on. Nothing here
tunes any gameplay number — **you are building measurement, not making balance
decisions.**

## 2. File boundary — hard

**You may touch:** `server/bench/**`, `tools/**`, `package.json` (scripts only),
`docs/briefs/session-balance-instruments-handoff.md`, and generated output in
`reports/**`.

**You may NOT touch:** `client/**`, `shared/src/data/**`, `shared/src/items.ts`,
`server/src/**` gameplay logic, or any authored balance number. Another session owns
`client/` tonight. **Changing an authored gameplay number is out of scope even if it
looks wrong** — report it instead.

`server/bench/` is covered by `server/tsconfig.bench.json`, wired into `pnpm typecheck`.
Keep it compiling.

---

## 3. Task A — Fix four instruments that currently lie

The bench and reports feed the balance pass. Four known defects make their output
untrustworthy. **These are the priority; do them first and verify each.**

### A1 — Every bench bot silently runs Berserker Stance

`canonicalLoadout` in `server/bench/balance/botFactory.ts:90` picks the active stance as
`stances[0]` from an **alphabetically sorted** list:

```ts
const stances = [...STANCE_DATABASE.keys()].sort();
// ...
activeStance: stances[0] ?? null,
```

When there were 3 stances that resolved to `defensive-stance`. A recent rework added 11,
so it now resolves to `berserker-stance`: **+65 attack, +25% attack speed, −12% damage
reduction, and 2% max-HP per second of deterministic self-damage that bypasses
mitigation and can kill.** Every bench number produced since that rework was measured on
a bot bleeding itself to death.

**Fix:** select the canonical stance *deliberately*, not incidentally. It should be a
neutral, representative posture — not the most extreme one, and not alphabetical
accident. Make the choice explicit and commented so the next roster change cannot
silently move it. Consider whether the bench should expose the stance as a sweep axis
rather than a single fixed pick; if you add that, keep a sensible default.

Rites have the same shape a few lines below (`equippedRites` admits rites greedily in
alphabetical order until the RP budget fills). Apply the same reasoning.

### A2 — The bench never equips a relic

Relics are the tier-4 build system — a sixth equipment slot with its own mechanic
resolver. Nothing in `server/bench/balance/` references them, so every T4 bench run is
missing an entire system.

**Fix:** extend the canonical loadout to equip a representative relic at the tiers where
relics are available. Follow how cores were added for the precedent — `coreScore` and
`bestCoreForBuild` in the same area show the intended shape (pick one appropriate to the
build rather than the first in a list). Relic gating is server-authoritative at T4; do
not equip one below its tier.

### A3 — `mob:report` could not run — **ALREADY FIXED, verify only**

The `mob:report` and `mob:llm` scripts were missing the
`--tsconfig ../tools/tsconfig.json` flag that `dps:report` and `ehp:report` carry, so
they died at import with `Cannot find module '@mmo-idle/shared'`. **This was fixed in
`package.json` on 2026-08-11.**

Some project docs still claim `dps-report` and `ehp-report` do not execute and that the
fix needs a lockfile change. **That is stale — all three run today.** Verify all three
and correct any doc that says otherwise:

```bash
pnpm dps:report && pnpm ehp:report && pnpm mob:report && pnpm mob:llm
```

### A4 — The fight bench's default time scale distorts results

Measured previously: simulation fidelity degrades as `timeScale` rises, because a coarse
tick quantises attack cadence downward. Throughput can only be **understated**, never
overstated, so the error is one-directional and compounds.

| scale | drift vs scale 1 |
|---|---|
| 2 | −1% |
| 3 | −6% |
| 5 | −4.5% to **−18%** (worse at higher tiers) |
| 10 | −29% to −32% |

Farm mode already caps at 2. `--mode boss` and `--mode overlord` still default to 5.

**Fix:** bring the fight bench's default in line (2), and warn on stdout when a run is
pushed above the ceiling outside an explicit sweep. **Note in your handoff that this
invalidates previously-collected matrices** — that consequence is the owner's to accept,
but it must be stated, not buried.

---

## 4. Task B — The enemy tables

**Start by reading `tools/mob-report.ts` and running `pnpm mob:llm`.** Much of what is
wanted already exists there and has simply never been runnable. Do not rebuild it.

### Why this matters more than it looks

The project is moving from "all biomes in a tier share one power budget" to **authored
per-mob numbers with no multiplier** — each biome deliberately different, some harder
than others. That decision removes the only thing that made cross-biome consistency
checkable. With 11 biomes × 4 tiers of hand-set numbers, **nothing in the data answers
"is mountain T3 in line with jungle T3?" any more.** A generated cross-biome table is now
the *only* view of drift. That is what you are building.

The existing packet already surfaces this. Current T3 output, entry-player column:

| Biome | Incoming DPS | TTL | Status |
|---|---:|---:|---|
| Swamp | 30.4 | 9.7s | Blocked |
| Mountain | 11.1 | 26.5s | Risky |
| Caverns | 10.8 | 27.4s | Risky |
| Tundra | 3.74 | 78.8s | Safe |
| Jungle | 1.81 | 163s | Safe |
| Desert | 1.75 | 169s | Safe |
| Volcanic | 0.49 | 597s | Safe |

A ~60× spread at one tier. **Do not "fix" this** — it is authored content and out of
your boundary. It is the evidence that the report is worth improving.

### B1 — A cross-biome comparison view at fixed tier

The packet's per-biome aggregates exist; what is missing is a single view that ranks
**every biome side by side at one tier** on comparable axes, so an outlier is obvious
without reading seven sections. Include at minimum: mean and max mob HP, mean and max
incoming DPS, spike potential, mob density, and the reward per kill. Sort by threat.

### B2 — Rewards alongside threat

Threat and payout must be readable together — "this biome is 3× as dangerous for the
same essence" is the central question of the coming pass, and today it takes two
documents. Pull reward data into the same table.

### B3 — A deviation report, not a verdict

Second of the owner's three priorities (tables → flags → loop speed). Flag biomes whose
threat or reward sits far from its tier siblings. **Deliberate outliers are the entire
point of the new model**, so this must read as "here is the spread, here is what stands
out", never as "this is wrong". Do not add a pass/fail gate, and do not let a threshold
become a de-facto balance target.

### B4 — Route data through one accessor *(architecture, cheap now, expensive later)*

A **tuning overlay** is planned but explicitly **not in this session's scope**: a
separate override file the sim reads on top of authored data, so experiments are
reversible and an agent can propose a whole tuning set as one file without editing 40
authored TypeScript files. (Chosen over a CSV round-trip because the authored data files
carry heavy design-rationale comments that a generated round-trip would destroy.)

**Do not build the overlay.** Do make every new read of monster/reward/cost data go
through a **single accessor function** rather than importing the databases directly at
each site, so the overlay can slot in later without a rewrite. Leave a short comment at
the accessor naming this intent.

---

## 5. Explicitly out of scope

- **The route-bot / progression harness.** A full T0→cap scripted-policy bot is planned
  and is being designed separately. Do not start it.
- The tuning overlay itself (see B4).
- Any change to an authored gameplay number.
- Anything in `client/`.

---

## 6. Acceptance

- `pnpm typecheck` clean (includes `server/tsconfig.bench.json`).
- `pnpm test` passes — 71/71 before this session. **The concurrent UI session adds one
  test; if you see 72, that is expected, not a conflict.**
- All four generators run clean: `pnpm dps:report`, `pnpm ehp:report`, `pnpm mob:report`,
  `pnpm mob:llm`.
- A balance bench run completes at T2 and T4 with the corrected loadout, and the handoff
  states how the numbers moved versus before A1/A2. **That delta is the proof the fixes
  mattered** — an unchanged number means the fix did not take.
- No file outside §2's boundary is modified (`git status` to confirm).

**Write `docs/briefs/session-balance-instruments-handoff.md`** with: what landed; the
before/after bench deltas from A1 and A2; which previously-collected data is now
invalidated by A4; anything you found that looks like a real gameplay defect (report,
do not fix); and any place where you had to guess.

**Do not commit** unless every acceptance item passes. Leave partial work uncommitted
and say so plainly in the handoff.

## 7. Working notes

- Tests are plain `tsx` scripts, not a framework: construct real `World`/component state,
  hand-rolled `assert`, trailing `console.log("<name>: ok")`. Files prefixed `_` are
  skipped by the runner. See `CLAUDE.md` → Tests.
- CI provisions no Postgres or Redis. Nothing you add may require them — construct
  `World` directly.
- `tools/balance-tui` is Rust, and is only a **viewer/orchestrator**. The simulation is
  TypeScript in `server/bench/balance/`. Almost nothing here should need Rust changes;
  if a new column genuinely needs one, prefer leaving it for a follow-up and say so.
- Treat "the tool ran and produced numbers" as **weak evidence**. This codebase has a
  documented history of instruments that encoded the very bug they were meant to catch —
  a core test that asserted fictional state, a geometry test that only covered the one
  angle that worked, and a wedge probe that counted dead bots as stuck ones. When a
  result looks clean, check that the check could have failed.
