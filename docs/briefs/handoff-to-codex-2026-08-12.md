# Handoff to Codex — 2026-08-12

**Shape of this document:** the previous two briefs were *unattended* specs. This one is
not. The user is continuing **interactively** in Codex, so this is a **context transfer
plus a prioritised menu** — where things stand, what I found reviewing the overnight
work, and what the candidate next steps cost. Ask the user rather than guessing; they
are present.

**Branch:** `feat/biome-ecology-pass2`, clean tree, everything pushed.
**Verified by me on review, not taken on trust:** `pnpm typecheck` clean ·
`pnpm test` **73/73** · `pnpm test:balance-instruments` passes · all four report
generators run.

Program doc: `docs/polish-and-balance-roadmap.md`. Repo contract: `CLAUDE.md`.

---

## 1. What landed overnight

Two sessions ran concurrently against hard file boundaries and both held their lanes.

**UI sweep** (`docs/briefs/session-ui-sweep-handoff.md`) — W1 and W3 complete. Mid-word
wrapping fixed at 16 of 17 sites with the 17th deliberately retained and explained; every
authored mechanic-effect key now has a real label, guarded by a test that was verified to
actually fail when a label is removed; combat log de-spammed and its stray number
removed; filler copy cut; crafting panel sorted highest-tier-first with kind icons,
contained scrolling, and two explicit craft-animation variants.

**Balance instruments** (`docs/briefs/session-balance-instruments-handoff.md`) — W5a and
W5c complete. Bench stance is now explicitly `perfection-stance` and recipe-gated (was
accidentally Berserker); rites are recipe-gated from an explicit priority; relics are
scored and equipped at T4; fight and farm modes share time scale 2. The mob packets now
lead each tier with a threat-ranked cross-biome table carrying HP, incoming DPS, spike,
density, essence and biome XP per kill, plus deviation signals that are explicitly not
gates. `tools/balance-data.ts` is the single authored-data seam the tuning overlay will
later attach to.

The A1/A2 deltas are the proof the fixes mattered: the T4 Desert probe went from 14.2s to
20.2s clear time and +70% damage taken once Berserker was removed. That is how far the
old baseline was off.

**Then three more commits landed with the user present**, after both handoffs were
written — the character plate rework, a rail-clipping fix, and `estimatePlayerDps`. That
last one is the reason for §2.

---

## 2. Three things neither handoff records

I found these reviewing the merged result. None is a criticism of either session — two of
them only exist *because* the sessions ran in parallel.

### 2.1 There are now two DPS models, and they disagree — **the important one**

`shared/src/systems/dpsEstimate.ts` (`estimatePlayerDps`, added in `f297675`) models each
archetype's actual cycle — cadence's finisher interval, reload's magazine and dead time,
DoT's conversion throughput, a Conduit's per-slot formation. It is used by **exactly one
caller**: `client/src/hud/stat/StatPanel.tsx`.

The balance tools still use the old `estimatePlayerHitDamage`:

- `tools/dps-report.ts`
- `tools/mob-report.ts`

That estimator is **direct-hit only**. The generated packets say so themselves — every
T1–T4 packet still carries *"Reference player DPS is direct-hit only (class
empowered/cadence/DoT mechanics omitted) → boss TTK is an UPPER bound"*.

**So the player-facing panel and the balance tooling now disagree about how strong a
build is, and the balance tooling is what is about to drive the balance pass.**

**Important nuance before anyone over-reacts:** the cross-biome Safe/Risky/Blocked
verdicts are computed from *incoming* damage (monster → player). Those do **not** depend
on the player DPS model, so the ~60× T3 threat spread stands, and swamp T3 really is
flagged Blocked for an entry player. What is understated is **player output** — boss TTK,
clear speed, and anything phrased as "can this build get through this".

This is the highest-value cleanup available right now: it repairs the instrument
everything downstream reads, and it is well-specified rather than exploratory.

### 2.2 `test:balance-instruments` does not run in CI

It lives at `server/bench/balance/instruments.test.ts`. The runner
(`scripts/run-tests.mjs:27-33`) reads only `server/test/` and walks `shared/src/`, so the
file is in neither root. `pnpm test` reports 73/73 without it, and CI never sees it.

That test guards precisely the defect class that already bit once — a stance roster
change silently moving the bench's canonical pick. A guard that does not run in CI will
not catch the next one. Cheapest fixes: move it to `server/test/`, or extend the runner
to walk `server/bench/`. Either is small; the choice is a repo-convention call for the
user.

### 2.3 Roadmap tick

I updated `docs/polish-and-balance-roadmap.md` to mark W1, W3, W5a and W5c done, W2 as
partly done, and Stage 3 as blocked only on W5b. The UI handoff flagged this as
outstanding; it is now current.

---

## 3. Where the program actually stands

| Stage | State |
|---|---|
| 1 — Reads as finished (W1, W3) | ✅ **Done** |
| 2 — Findable (W2) | 🔨 **Partly.** Character stat panel rebuilt. **Not done:** promoting Upgrade / Runes / Crafting to top level, the stance indicator, rites in detailed stats, and the buff/debuff colouring. |
| 3 — Honest instruments | ✅ W5a · ✅ W5c · ⬜ **W5b** |
| 4 — Route bots (W5d) | ⬜ Not started; still needs design |
| 5 — The balance pass | ⬜ Gated on W5b |
| 6–8 — Content depth, T5/T6, release | ⬜ |

**W5b — writing down what "balanced" means — is now the single gate on the balance
pass.** It is the user's design statement, not an agent task: the per-biome difficulty
ordering, and how sharply mob strength, rewards and player strength should grow per tier.
Their stated direction so far: *"significant but surmountable, sharper as tiers go up, the
player must still be able to clear the new zone"*, to be settled against real numbers
rather than in advance. The numbers now exist — that is what changed overnight.

---

## 4. Candidate next steps, with costs

Put these to the user; do not pick unilaterally.

**A. Reconcile the two DPS models.** *(~1 session, well-specified, verifiable)*
Point `dps-report.ts` and `mob-report.ts` at `estimatePlayerDps`, drop the "UPPER bound"
caveats that are no longer true, and regenerate. Watch for: the two estimators may
disagree on `cannotAttack` handling for Conduit; the reference-player construction in the
tools is spec-agnostic and averaged, while `estimatePlayerDps` wants a concrete build, so
the seam needs thought rather than a find-and-replace. **My recommendation for first**,
because every later judgement reads these numbers.

**B. Put the instruments test in CI.** *(~15 minutes)* §2.2. Do it alongside A.

**C. Design and build the route-bot harness (W5d).** *(design conversation, then ~2+
sessions)* The remaining big build. Deliberately kept out of the overnight briefs because
it needs decisions, and an interactive session is the right place for them. Settled
already: a **full progression run, T0 to cap**, following a scripted policy — not an LLM.
Open: what the policy language looks like, how the run reports (per-tier gates? a
timeline?), the death policy, and how it reuses the existing farm-mode ledger. Note the
measured fidelity ceiling of `timeScale ≤ 2` constrains how fast a multi-day run can be.

**D. Finish W2's top-level architecture.** *(~1 session, client)* Promote Upgrade, Runes
and Crafting; add the stance indicator; list rites in detailed stats. Settled spec, no
open questions — but it is `client/` work, so consider who is best placed.

**E. The buff/debuff colouring.** *(~1 session)* Settled: stance **counts** as temporary,
so temporary = stance + timed buffs + debuffs + status; baseline = gear, cores, relics,
skill tree. The UI handoff §9 found this harder than expected — runtime DR systems mutate
`mitigatesDamage.damageReduction` in place, so the current value already includes them
with no record of the prior value, and the stance fold sits mid-function in
`recalculatePlayerStats`, so a baseline pass cannot just snapshot the end. Two routes are
written up there: stance-only client-side (cheap, partial) or a full server baseline
(complete, more plumbing).

---

## 5. Working notes worth carrying

- **The user edits balance numbers themselves.** Build instruments and tables; do not
  tune gameplay values unless asked.
- **Treat "the tool ran and produced numbers" as weak evidence.** This repo has a
  documented history of instruments that encoded the bug they were meant to catch: a core
  test asserting fictional state, a geometry test covering only the angle that worked, and
  a wedge probe that counted dead bots as stuck ones. When a result looks clean, check the
  check could have failed.
- **The balance model is authored-per-mob with no biome multiplier.** That makes the
  cross-biome table the *only* view of drift — it is load-bearing, not a convenience.
- **Methodology (roadmap W5e):** instrument whether the optimum *changes across contexts*
  rather than how strong it is; balance against a competent floor rather than a ceiling;
  layered sweeps over the cross product; a dominance check instead of an optimum search.
  Simulating the full build space is ruled out as intractable.
- **Pre-existing gap reported by the balance session, not fixed:**
  `server/bench/balance/progression.ts` excludes three Cooldown-heavy T3 paths because
  their server logic is unimplemented. That is a real content gap, not a tooling one.
- `docs/next-playtest-implementation-plan.md` §5.7 defect C is still stale (it claims the
  DPS/eHP tools cannot execute). The correction lives in the roadmap; the historical plan
  was left alone deliberately by both sessions.
